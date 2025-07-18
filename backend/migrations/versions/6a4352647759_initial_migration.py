"""Initial migration

Revision ID: 6a4352647759
Revises: d919e25e4116
Create Date: 2025-03-16 14:28:47.773146

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6a4352647759'
down_revision = 'd919e25e4116'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('jobs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('max_backlogs', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('gender_eligibility', sa.String(length=6), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('jobs', schema=None) as batch_op:
        batch_op.drop_column('gender_eligibility')
        batch_op.drop_column('max_backlogs')

    # ### end Alembic commands ###
